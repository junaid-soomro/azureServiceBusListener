const saveToDb = require("./saveMessage").saveEventToDatabase;
const { delay, ServiceBusClient } = require("@azure/service-bus");
require("dotenv").config();

(async () => {
  if (!(await require("./singletonConnection").getConnection())) {
    await require("./singletonConnection").initConnection();
  }
  const topicName = process.env.TOPIC_NAME;

  //need a subscription name here
  const subscriptionName = "testSubscription";
  const serviceClient = new ServiceBusClient(
    process.env.AZURE_CONNECTION_STRING
  );
  const receiver = serviceClient.createReceiver(topicName, subscriptionName);
  console.log("Awaiting MESSAGES...");
  const myMessageHandler = async (message) => {
    console.log("MESSAGES", message);
    if ("collection" in message.body && "data" in message.body) {
      let { collection, ...other } = message.body;
      if ("orgId" in message.body) {
        collection = message.body.orgId + "_" + collection;
      }

      await saveToDb(collection, other);
      await receiver.completeMessage(message);
    }
  };
  const myErrorHandler = async (args) => {
    console.log(
      `Error occurred with ${args.entityPath} within ${args.fullyQualifiedNamespace}: `,
      args.error
    );
  };
  receiver.subscribe({
    processMessage: myMessageHandler,
    processError: myErrorHandler,
  });

  // a smart tweak to make the application behave as a listener because azure javascript library does not provide asynchronous listening for queues and topics.
  let interval = setInterval(async () => await delay(3999), 4000);
  await delay(5000);

  process.on("SIGINT", async () => {
    console.log("TERMINATING JOB.");
    clearInterval(interval);
    await receiver.close();
    await serviceClient.close();
    process.exit(1);
  });

  process.on("SIGTERM", async function () {
    console.log("TERMINATING JOB.");
    clearInterval(interval);
    await receiver.close();
    await serviceClient.close();
    process.exit(1);
  });
  console.log("JOB RUNNING.");
})();
