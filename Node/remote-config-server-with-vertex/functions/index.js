// [START remote_config_server_vertex_init]
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const { initializeApp } = require("firebase-admin/app");
const { VertexAI } = require('@google-cloud/vertexai');
const { getRemoteConfig } = require("firebase-admin/remote-config");

// Set and check environment variables.
const project = process.env.GCLOUD_PROJECT;

// Initialize Firebase.
const app = initializeApp();
// [END remote_config_server_vertex_init]

// [START remote_config_server_vertex_default_values]
// Define default (fallback) parameter values for Remote Config.
const defaultConfig = {

  // Default values for Vertex AI.
  model_name: "gemini-1.5-flash-002",
  generation_config: [{
    "stopSequences": [], "temperature": 0.7,
    "maxOutputTokens": 64, "topP": 0.1, "topK": 20
  }],
  prompt: "I'm a developer who wants to learn about Firebase and you are a \
    helpful assistant who knows everything there is to know about Firebase!",
  safety_settings: [{
    "category":
      "HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE"
  }],
  location: 'us-central1',

  // Disable Vertex AI Gemini API access for testing.
  vertex_enabled: false
};
// [END remote_config_server_vertex_default_values]

// [START remote_config_server_vertex_create_function]
// Export the function.
exports.generateWithVertex = onRequest(async (request, response) => {

  try {

    // Set up Remote Config.
    const rc = getRemoteConfig(app);

    // Get the Remote Config template and assign default values.
    const template = await rc.getServerTemplate({
      defaultConfig: defaultConfig
    });

    // Add the template evaluation to a constant.
    const config = template.evaluate();

    // Obtain values from Remote Config.
    const textModel = config.getString("model_name") ||
        defaultConfig.model_name;
    const textPrompt = config.getString("prompt") || defaultConfig.prompt;
    const generationConfig = config.getString("generation_config") ||
        defaultConfig.generation_config;
    const safetySettings = config.getString("safety_settings") ||
        defaultConfig.safety_settings;
    const location = config.getString("location") ||
        defaultConfig.location;
    const vertexEnabled = config.getBoolean("is_vertex_enabled") ||
        defaultConfig.vertex_enabled;
// [END remote_config_server_vertex_create_function]

// [START remote_config_server_vertex_function_logic]
  // Allow user input.
  const userInput = request.query.prompt || '';

  // Instantiate Vertex AI.
    const vertex_ai = new VertexAI({ project: project, location: location });
    const generativeModel = vertex_ai.getGenerativeModel({
      model: textModel,
      safety_settings: safetySettings,
      generation_config: generationConfig,
    });

    // Combine prompt from Remote Config with optional user input.
    const chatInput = textPrompt + " " + userInput;

    if (!chatInput) {
      return res.status(400).send('Missing text prompt');
    }
    // If vertexEnabled isn't true, do not send queries to Vertex AI.
    if (vertexEnabled !== true) {
      response.status(200).send({
        message: "Vertex AI call skipped. Vertex is not enabled."
      });
      return;
    }

    logger.log("\nRunning with model ", textModel, ", prompt: ", textPrompt,
      ", generationConfig: ", generationConfig, ", safetySettings: ",
      safetySettings, " in ", location, "\n");

    const result = await generativeModel.generateContentStream(chatInput); 
    response.writeHead(200, { 'Content-Type': 'text/plain' });

    for await (const item of result.stream) {
      const chunk = item.candidates[0].content.parts[0].text;
      logger.log("Received chunk:", chunk);
      response.write(chunk);
    }

    response.end();

  } catch (error) {
    logger.error(error);
    response.status(500).send('Internal server error');
  }
});
// [END remote_config_server_vertex_function_logic]

