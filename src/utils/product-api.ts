import https from "node:https";

// The URL to fetch the products from needs to be changed a bit for the json:
// Original: https://github.com/Exove/developer-test/blob/main/material/products.json
// Updated: https://raw.githubusercontent.com/Exove/developer-test/main/material/products.json
const options = {
  host: "raw.githubusercontent.com",
  port: 443,
  Headers: {
    "content-type": "application/json",
  },
  path: "Exove/developer-test/main/material/products.json",
};

/**
 * Simple function to fetch the JSON data from the API.
 *
 * This is in it's own file to allow mocking.
 *
 * @returns The JSON data from the API.
 */
const getProductJson = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (res) => {
        data += res;
      });

      res.on("end", () => {
        if (!res.statusCode || res.statusCode !== 200) {
          return reject(`Error: ${res.statusCode} ${res.statusMessage}`);
        }
        resolve(data);
      });
    });

    req.end(() => {
      console.log("Request sent");
    });
  });
};

export default { getProductJson };
