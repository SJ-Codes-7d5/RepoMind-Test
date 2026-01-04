import db from "./config.js";
import axios from "axios";
import cassandra from "cassandra-driver";

export async function getHealthStatus() {
  const status = {
    server: "running",
    db: "unknown",
    kafka: "unknown",
    cassandra: "unknown",
    opensearch: "unknown",
    smtp: "ready"
  };

  // PostgreSQL
  try {
    await db.query("SELECT 1");
    status.db =
      process.env.DB_MODE === "aws"
        ? "AWS RDS PostgreSQL"
        : "Local PostgreSQL";
  } catch (err) {
    status.db = "error: " + err.message;
  }

  // Kafka Connect
  try {
    const res = await axios.get("http://localhost:8083/connectors");
    status.kafka = `running (${res.data.length} connectors)`;
  } catch (err) {
    status.kafka = "not reachable";
  }

  // Cassandra
  try {
    const cassClient = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_HOST || "127.0.0.1"],
      localDataCenter: process.env.CASSANDRA_DC || "datacenter1",
      keyspace: process.env.CASSANDRA_KEYSPACE || "system"
    });
    await cassClient.connect();
    status.cassandra = "running";
    await cassClient.shutdown();
  } catch {
    status.cassandra = "not reachable";
  }

  // OpenSearch
  try {
    const res = await axios.get("http://localhost:9200");
    if (res.data && res.data.cluster_name) {
      status.opensearch = `running (${res.data.cluster_name})`;
    } else {
      status.opensearch = "responded without cluster_name";
    }
  } catch {
    status.opensearch = "not reachable";
  }

  return status;
}
