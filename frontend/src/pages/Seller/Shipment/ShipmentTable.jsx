import React, { useEffect, useMemo, useState } from "react";
import { mdiDelete, mdiPencil, mdiPrinter } from "@mdi/js";
import Icon from "@mdi/react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../../utils/api";
import { formatDateTime, getLastNDaysRange } from "../../../middleware/CommonFunctions";
import Pagination from "../../../Component/Pagination";
import ShipmentsConfig from "../../../config/Shipments/ShipmentsConfig";
import warehouseConfig from "../../../config/Warehouse/WarehouseConfig";
function ShipmentsTable() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [selectedShipments, setselectedShipments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [defaultStart, defaultEnd] = useMemo(() => getLastNDaysRange(7), []);
  const [warehouseList, setWarehouseList] = useState([]);
  const handleWarehouseData = async () => {
    try {
      const url = warehouseConfig.warehouseApi;
      const { data } = await api.get(url);
      const results = data?.data?.result || [];
      setWarehouseList(results);
    } catch (error) {
      console.error("Fetch warehouses error:", error);
      setWarehouseList([]);
    }
  };

  const formatWeight = (weight) => {
    if (!weight) return "";
    return weight >= 1000
      ? `Wt: ${(weight / 1000).toFixed(2)} kg`
      : `Wt: ${weight} gm`;
  };
  const handleFetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: Number.parseInt(searchParams.get("page") || "1", 10),
        limit: Number.parseInt(searchParams.get("limit") || "10", 10),
        start_date: searchParams.get("start_date") || defaultStart,
        end_date: searchParams.get("end_date") || defaultEnd,
      };

      const optionalKeys = [
        "orderId",
        "shippingName",
        "warehouse_id",
        "paymentType",
        "category",
      ];
      optionalKeys.forEach((key) => {
        const value = searchParams.get(key)?.trim();
        if (value) params[key] = value;
      });
      const query = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      const url = `${ShipmentsConfig.fetchshipmentlist}?${query}`;
      const { data } = await api.get(url);
      setDataList(data?.data?.result || []);
      setTotalCount(data?.data?.total || 0);
    } catch (error) {
      console.error("Fetch orders error:", error);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };
  const findWarehouse = (warehouseId) => {
    const warehouse = warehouseList.find((w) => w.id == warehouseId);

    if (!warehouse) return "";

    return `${warehouse.city} (${warehouse.state} - ${warehouse.pincode})`;
  };
  useEffect(() => {
    handleWarehouseData();
  }, []);
  useEffect(() => {
    handleFetchData();
  }, [searchParams]);

  const handleSelect = (id) => {
    setselectedShipments((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };


  const handleSelectAll = () => {
    const bookedIds = dataList
      .filter((d) => d.shipping_status === "booked")
      .map((d) => d.id);
    if (selectedShipments.length === bookedIds.length) {
      setselectedShipments([]);
    } else {
      setselectedShipments(bookedIds);
    }
  };


  const handleBulkCancel = async () => {
    alert(selectedShipments);
    if (!selectedShipments.length) {
      alert("No shipments selected");
      return;
    }

    try {
      await cancelShipments(selectedShipments);
      alert("Shipments cancelled successfully");
      setselectedShipments([]);
      handleFetchData();
    } catch (err) {
      alert("Failed to cancel shipments");
    }
  };

  const cancelShipments = async (shipmentIds) => {
    try {
      const url = ShipmentsConfig.cancelshipment;
      const res = await api.post(url, {
        shipment_ids: shipmentIds,
      });
      return res.data;
    } catch (error) {
      console.error(
        "Cancel failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  };


  const downloadLabels = async () => {
    if (!selectedShipments.length) {
      alert("Please select at least one booked shipment");
      return;
    }
    try {
      const apiUrl = ShipmentsConfig.shipment_bulk_label;
      const response = await api.post(
        apiUrl,
        {
          shipping_db_ids: selectedShipments,
        },
        {
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "shipment-labels.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Label download error:", error);
      alert("Failed to download labels");
    }
  };





  return (
    <div className="tab-content tab-content-vertical">
      <div className="tab-pane fade show active" role="tabpanel">
        <div>
          {selectedShipments.length > 0 && (
            <>
              <div className="d-flex justify-content-start align-items-center mb-2 gap-2 border-bottom pb-2">
                <div
                  className="btn btn-light btn-md py-3 px-3 text-dark"
                  style={{ width: "fit-content" }}
                >
                  Selected: {selectedShipments?.length}
                </div>
                <div onClick={downloadLabels} disabled={!selectedShipments.length} className="btn btn-dark btn-md py-3 px-3" style={{ width: "fit-content" }}>
                  <Icon path={mdiPrinter} size={0.7} /> Bulk Label
                </div>
                <div className="btn btn-dark btn-md py-3 px-3" style={{ width: "fit-content" }} onClick={handleBulkCancel}>
                  <Icon path={mdiDelete} size={0.7} /> Bulk Cancel
                </div>
              </div>
            </>
          )}
        </div>
        <div className="table-responsive table-scroll-x">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    style={{ cursor: "pointer" }}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Last Updated</th>
                <th>Order Details</th>
                <th>Shipment Details</th>
                <th>Drop Details</th>
                <th>Pickup Details</th>
                <th>Shipment Status</th>
                <th>EDD</th>
                <th>Tags</th>

                {/* Fixed column */}
                <th className="sticky-action">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="py-3">
                  <input type="checkbox" style={{ cursor: "pointer" }} />
                </td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>

                {/* Fixed column */}
                <td className="py-3 sticky-action">hello00000000000000000</td>
              </tr>
              <tr>
                <td className="py-3">
                  <input type="checkbox" style={{ cursor: "pointer" }} />
                </td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>

                {/* Fixed column */}
                <td className="py-3 sticky-action">hello00000000000000000</td>
              </tr>
              <tr>
                <td className="py-3">
                  <input type="checkbox" style={{ cursor: "pointer" }} />
                </td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>

                {/* Fixed column */}
                <td className="py-3 sticky-action">hello00000000000000000</td>
              </tr>
              <tr>
                <td className="py-3">
                  <input type="checkbox" style={{ cursor: "pointer" }} />
                </td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>
                <td className="py-3">hello00000000000000000</td>

                {/* Fixed column */}
                <td className="py-3 sticky-action">hello00000000000000000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {dataList.length > 0 && !loading && (
          <Pagination totalCount={totalCount} />
        )}
      </div>
    </div>
  )
}

export default ShipmentsTable