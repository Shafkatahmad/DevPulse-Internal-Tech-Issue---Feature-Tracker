import app from "./app";
import config from "./config";

const main = () => {
  app.listen(config.port, () => {
    console.log(`DevPulse app listening on port ${config.port}`);
  });
};

main();
