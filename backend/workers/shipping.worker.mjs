

import { parentPort, isMainThread } from "node:worker_threads";
import { shippingCron, remittanceCron } from "../crons/shipping.cron.mjs";
import ShopifyProvider from "../providers/couriers/shopify.provider.mjs";
import ShippingConsumer from "../queue/consumer/shipping.consumer.mjs";
import AdminExportsConsumer from "../queue/consumer/admin/admin.exports.consumer.mjs";
import AdminImportsConsumer from "../queue/consumer/admin/admin.imports.consumer.mjs";

(async () => {
  await ShippingConsumer.handleShipmentCreateConsumer();
  await ShippingConsumer.handleShipmentCancelConsumer();
  await ShippingConsumer.handleShipmentRetryConsumer();
  await AdminExportsConsumer.handleExportProcessConsumer();
  await AdminImportsConsumer.handleImportProcessConsumer();
  await shippingCron.start();
  await remittanceCron.start();

  // Only send ready signal if actually running inside Worker Thread
  if (!isMainThread && parentPort) {
    parentPort.postMessage("ready");
  }
})();
