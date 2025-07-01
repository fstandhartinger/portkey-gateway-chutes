import http from 'http';
import { URL } from 'url';

// Configuration
const PORTKEY_BASE_URL = 'http://localhost:8787';
const PORTKEY_API_KEY = process.env.PORTKEY_API_KEY;
const CHUTES_API_KEY = process.env.CHUTES_API_KEY;

if (!PORTKEY_API_KEY) {
  console.error('❌ PORTKEY_API_KEY environment variable is required');
  process.exit(1);
}

if (!CHUTES_API_KEY) {
  console.error('❌ CHUTES_API_KEY environment variable is required');
  process.exit(1);
}

// List of 15 Chutes.ai models to test
const CHUTES_MODELS = [
  'deepseek-ai/DeepSeek-V3-0324',
  'deepseek-ai/DeepSeek-R1',
  'deepseek-ai/DeepSeek-R1-0528',
  'deepseek-ai/DeepSeek-V3',
  'NousResearch/DeepHermes-3-Mistral-24B-Preview',
  'NousResearch/DeepHermes-3-Llama-3-8B-Preview',
  'tngtech/DeepSeek-R1T-Chimera',
  'BAAI/bge-large-en-v1.5',
  'chutesai/Llama-4-Maverick-17B-128E-Instruct-FP8',
  'Qwen/Qwen3-235B-A22B',
  'unsloth/gemma-3-27b-it',
  'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
  'Qwen/Qwen3-32B',
  'Qwen/QwQ-32B',
  'ArliAI/QwQ-32B-ArliAI-RpR-v1',
];

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function for a single model
async function testModel(model) {
  console.log(`\n🧪 Testing model: ${model}`);

  try {
    // Test chat completion
    const chatOptions = {
      hostname: 'localhost',
      port: 8787,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PORTKEY_API_KEY}`,
        'x-portkey-provider': 'chutes',
        'x-portkey-api-key': CHUTES_API_KEY,
      },
    };

    const chatPayload = {
      model: model,
      messages: [
        {
          role: 'user',
          content:
            'Hello! Please respond with just "Hello from Chutes.ai" to confirm the integration is working.',
        },
      ],
      max_tokens: 50,
      temperature: 0.1,
    };

    const startTime = Date.now();
    const response = await makeRequest(chatOptions, chatPayload);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (
      response.status === 200 &&
      response.data.choices &&
      response.data.choices[0]
    ) {
      const message = response.data.choices[0].message?.content || '';
      console.log(`   ✅ Success (${responseTime}ms)`);
      console.log(`   📝 Response: ${message.trim()}`);
      console.log(`   🔧 Model: ${response.data.model || model}`);
      return { success: true, model, responseTime, message: message.trim() };
    } else {
      console.log(`   ❌ Failed - Status: ${response.status}`);
      console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
      return {
        success: false,
        model,
        error: response.data,
        status: response.status,
      };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, model, error: error.message };
  }
}

// Test Chutes.ai models endpoint
async function testModelsEndpoint() {
  console.log('\n🔍 Testing Chutes.ai models endpoint...');

  try {
    const modelsOptions = {
      hostname: 'localhost',
      port: 8787,
      path: '/v1/reference/models',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PORTKEY_API_KEY}`,
        'x-portkey-provider': 'chutes',
        'x-portkey-api-key': CHUTES_API_KEY,
      },
    };

    const response = await makeRequest(modelsOptions);

    if (response.status === 200 && response.data.data) {
      const chutesModels = response.data.data.filter(
        (m) => m.id.includes('chutes') || CHUTES_MODELS.includes(m.id)
      );
      console.log(
        `   ✅ Models endpoint working - Found ${chutesModels.length} Chutes.ai models`
      );
      console.log(
        `   📋 Sample models: ${chutesModels
          .slice(0, 3)
          .map((m) => m.id)
          .join(', ')}`
      );
      return true;
    } else {
      console.log(`   ❌ Models endpoint failed - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Models endpoint error: ${error.message}`);
    return false;
  }
}

// Check if Portkey Gateway is running
async function checkGatewayStatus() {
  console.log('🔍 Checking if Portkey Gateway is running...');

  try {
    const healthOptions = {
      hostname: 'localhost',
      port: 8787,
      path: '/',
      method: 'GET',
    };

    const response = await makeRequest(healthOptions);

    if (
      response.status === 200 &&
      response.data.includes('AI Gateway says hey!')
    ) {
      console.log('   ✅ Portkey Gateway is running');
      return true;
    } else {
      console.log(
        `   ❌ Gateway health check failed - Status: ${response.status}`
      );
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Gateway is not running: ${error.message}`);
    console.log('   💡 Please start the gateway with: npm run dev:node');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Chutes.ai Provider Integration Tests');
  console.log('================================================');

  // Check if gateway is running
  const isGatewayRunning = await checkGatewayStatus();
  if (!isGatewayRunning) {
    process.exit(1);
  }

  // Test models endpoint
  await testModelsEndpoint();

  // Test each model
  console.log(`\n🧪 Testing ${CHUTES_MODELS.length} Chutes.ai models...`);
  const results = [];

  for (const model of CHUTES_MODELS) {
    const result = await testModel(model);
    results.push(result);

    // Small delay between requests to be respectful
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n🎉 Successful Models:');
    successful.forEach((r) => {
      console.log(`   • ${r.model} (${r.responseTime}ms)`);
    });
  }

  if (failed.length > 0) {
    console.log('\n💥 Failed Models:');
    failed.forEach((r) => {
      console.log(`   • ${r.model} - ${r.error || 'Unknown error'}`);
    });
  }

  // Performance stats
  if (successful.length > 0) {
    const avgResponseTime =
      successful.reduce((sum, r) => sum + r.responseTime, 0) /
      successful.length;
    const minResponseTime = Math.min(...successful.map((r) => r.responseTime));
    const maxResponseTime = Math.max(...successful.map((r) => r.responseTime));

    console.log('\n⚡ Performance Stats:');
    console.log(`   • Average response time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   • Fastest response: ${minResponseTime}ms`);
    console.log(`   • Slowest response: ${maxResponseTime}ms`);
  }

  console.log('\n🏁 Testing completed!');

  // Exit with error code if any tests failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('💥 Test runner error:', error);
  process.exit(1);
});
