const { MongoClient } = require("mongodb");
const { performance } = require("perf_hooks");

const uri =
  "mongodb://admin-user:admin123@localhost:21664/?readPreference=primary&replicaSet=mongodb-replica&tls=true&tlsAllowInvalidCertificates=true";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function manualLoggingAndValidation(collection, filter, update) {
  const startTime = performance.now();

  console.log("Dry-run operation:");
  console.log(`Filter: ${JSON.stringify(filter)}`);
  console.log(`Update: ${JSON.stringify(update)}`);

  const results = await collection.find(filter).toArray();
  console.log(`Matched documents: ${JSON.stringify(results)}`);

  const endTime = performance.now();
  console.log(`Manual Logging and Validation Time: ${endTime - startTime} ms`);
}

async function transactionSimulation(collection, filter, update) {
  const session = client.startSession();
  session.startTransaction();

  const startTime = performance.now();

  try {
    await collection.updateOne(filter, update, { session });
    const results = await collection.find(filter, { session }).toArray();
    console.log(
      `Modified documents (within transaction): ${JSON.stringify(results)}`,
    );
    await session.abortTransaction();
  } catch (err) {
    console.error("Transaction error:", err);
    await session.abortTransaction();
  } finally {
    session.endSession();
  }

  const endTime = performance.now();
  console.log(`Transaction Simulation Time: ${endTime - startTime} ms`);
}

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("testdb");
    const collection = database.collection("testcollection");

    const filter = { name: "John Doe" };
    const update = { $set: { age: 30 } };

    await manualLoggingAndValidation(collection, filter, update);
    await transactionSimulation(collection, filter, update);
  } finally {
    await client.close();
  }
}
run();
