const schemaGenerator = require("./Schema/serviceBusSchema").schemaGenerator;

//change dump to saveEvent
const saveEventToDatabase = async (collectionName, record) => {
  try {
    let currentSchema = await schemaGenerator(collectionName);

    const respo = await currentSchema.create({
      id: record?.id,
      ...record?.data,
    });
    console.log("MESSAGE DUMPED TO DB: ", respo);
  } catch (e) {
    console.log("Could not save data to database.", e);
  }
};

module.exports = { saveEventToDatabase };
