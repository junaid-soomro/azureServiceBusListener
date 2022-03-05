const dumpToDb = require("./dumpMessage").dumpEventToDatabase;
const {
  delay,
  ServiceBusClient,
  ServiceBusAdministrationClient,
} = require("@azure/service-bus");
require("dotenv").config();

//Process termination listeners

const mainFunction = async () => {
  if (!(await require("./singletonConnection").getConnection())) {
    await require("./singletonConnection").initConnection();
  }
  const connectionString = process.env.AZURE_CONNECTION_STRING;
  const topicName = process.env.TOPIC_NAME;

  const subscriptionName = "testSubscription";

  //One for managing subscriptions and the other for recieving purposes.
  const serviceBusAdministrationClient = new ServiceBusAdministrationClient(
    connectionString
  );

  const serviceClient = new ServiceBusClient(connectionString);
  let subscription = null;
  subscription = await serviceBusAdministrationClient
    .getSubscription(topicName, subscriptionName)
    .catch((err) => console.log("Subscription does not exist. Creating.."));

  if (!subscription) {
    await serviceBusAdministrationClient
      .createSubscription(topicName, subscriptionName)
      .catch((err) => {
        console.log("Failed to subscribe to topic: ", err);
      });
  }
  const receiver = serviceClient.createReceiver(topicName, subscriptionName);
  console.log("Awaiting MESSAGES...");

  let receivingMessages = true;
  const interval = setInterval(async () => {
    if (receivingMessages) {
      receivingMessages = false;
      try {
        for await (let message of receiver.getMessageIterator()) {
          console.log("MESSAGES", message);
          if ("collection" in message.body && "data" in message.body) {
            let { collection, ...other } = message.body;
            if ("orgId" in message.body) {
              collection = message.body.orgId + "_" + collection;
            }

            await dumpToDb(collection, other);
            await receiver.completeMessage(message);
            receivingMessages = true;
          }
        }
      } catch (e) {
        receivingMessages = false;
      }
    }
  }, 5000);

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
};

mainFunction();
