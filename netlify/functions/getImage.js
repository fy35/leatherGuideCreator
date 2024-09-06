const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  const { url } = event.queryStringParameters;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL parameter is required" }),
    };
  }

  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const base64 = buffer.toString("base64");
    const contentType = response.headers.get("content-type");

    return {
      statusCode: 200,
      body: JSON.stringify({ base64, contentType }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch image" }),
    };
  }
};
