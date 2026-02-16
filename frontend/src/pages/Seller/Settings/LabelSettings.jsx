import React, { useEffect, useState } from "react";
import api from "../../../utils/api";
import { useAlert } from "../../../middleware/AlertContext";
import companyDetailsConfig from "../../../config/CompanyDetails/CompanyDetailsConfig";
import a4Image from "../../../assets/image/size-a4.png";
import thermalImage from "../../../assets/image/thermal-label.png";

/* ================= PREVIEW ================= */
const LabelPreview = ({ settings, logo }) => {
  const isThermal = settings.paper_size === "thermal";

  return (
    <div
      className="border rounded shadow-sm bg-white p-3"
      style={{
        width: isThermal ? 380 : 700,
        fontSize: isThermal ? 11 : 14,
        minHeight: 500,
      }}
    >
      {/* TO SECTION */}
      <div className="preview-label">
        {/* TOP ROW */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          {/* LEFT : TO SECTION */}
          <div style={{ width: "60%" }}>
            <p className="mb-1"><b>To:</b> John Doe</p>
            <p className="mb-1">
              <b>Address:</b> <br></br>
              New Karol Bagh Near Home of Lie Area, 
              <br></br>Delhi, <br></br>New Delhi, <br></br>122002
            </p>
          </div>
          {/* RIGHT : LOGO */}
          <div
            style={{
              width: "40%",
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
            }}
          >
            {logo ? (
              <img
                src={logo}
                alt="Company Logo"
                style={{ height: 40, objectFit: "contain" }}
              />
            ) : (
              <small className="text-muted">Company Logo</small>
            )}
          </div>
        </div>
        {/* DIVIDER */}
        <hr />
      </div>
      <div className="preview-label">

  {/* ORDER + BARCODE ROW */}
  <div className="d-flex justify-content-between align-items-start mb-2">

    {/* LEFT : ORDER DETAILS */}
    <div style={{ width: "50%" }}>
      <p className="mb-1 fw-semibold">
        Order No:
        <span className="ms-1 fw-bold">MORS934434892</span>
      </p>

      <div className="mt-1">
        <small className="text-muted d-block fw-semibold">Payment Details</small>
        <small className="mb-0 fw-semibold">COD (₹1299)</small>
      </div>
    </div>

    {/* RIGHT : BARCODE */}
    <div
      style={{
        width: "50%",
        textAlign: "right",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {/* BARCODE IMAGE */}
      <img
        src="https://api-bwipjs.metafloor.com/?bcid=code128&text=AWB123456789&scale=2&includetext=false"
        alt="Barcode"
        style={{
          height: 60,
          maxWidth: "100%",
          objectFit: "contain",
        }}
      />

      {/* AWB NUMBER */}
      <small className="fw-semibold mt-1">AWB: AWB123456789</small>
    </div>

  </div>

  {/* DIVIDER */}
  <hr />
</div>



      {!settings.hide_end_customer_contact_number && (
        <p className="mb-1">📞 9876543210</p>
      )}

      {!settings.hide_product_details && (
        <p className="mb-1">📦 Product: T-Shirt (Qty: 1)</p>
      )}

      {!settings.hide_seller_gst_number && (
        <p className="mb-1">GST: 07ABCDE1234F1Z5</p>
      )}

      {!settings.hide_warehouse_address && (
        <p className="mb-1">🏭 Warehouse: Delhi, India</p>
      )}

      {!settings.hide_warehouse_mobile_number && (
        <p className="mb-1">📱 Warehouse Phone: 9999999999</p>
      )}

      <hr />
      <small className="text-muted">Powered by Movora Service</small>
    </div>
  );
};

/* ================= MAIN ================= */
function LabelSettings() {
  const { showError, showSuccess } = useAlert();

  const [logo, setLogo] = useState(null);
  const [labelSettings, setLabelSettings] = useState({
    paper_size: "thermal",
    hide_product_details: false,
    hide_seller_gst_number: false,
    hide_warehouse_address: false,
    hide_warehouse_mobile_number: false,
    hide_end_customer_contact_number: false,
  });

  /* ---------- FETCH ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(companyDetailsConfig.companyDetails);
        const settings =
          res?.data?.data?.companyDetails?.label_settings || {};
        setLabelSettings((prev) => ({ ...prev, ...settings }));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* ---------- HANDLERS ---------- */
  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    setLabelSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        companyDetailsConfig.labelSettingConfig,
        labelSettings
      );
      showSuccess("Label settings updated");
    } catch {
      showError("Something went wrong");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="row">
      {/* LEFT PANEL */}
      <div className="col-md-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">Label Settings</h5>
            {/* LOGO UPLOAD */}
            <div className="row mb-4">
              {/* LOGO UPLOAD */}
              <div className="col-md-6">
                <div className="border rounded p-3 h-100">
                  <label className="fw-semibold mb-1 d-block">
                    Company Logo
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) =>
                      setLogo(URL.createObjectURL(e.target.files[0]))
                    }
                  />
                </div>
              </div>

              {/* LABEL SIZE */}
              <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <label className="fw-semibold mb-1 d-block">
                      Label Size
                    </label>
                    {[
                      ["standard", "A4 Desktop Printer", a4Image],
                      ["thermal", "Thermal Printer (4×6)", thermalImage],
                    ].map(([value, title, img]) => (
                      <label
                        key={value}
                        className={`border rounded p-2 mb-2 d-flex align-items-center cursor-pointer ${
                          labelSettings.paper_size === value
                            ? "border-dark bg-light"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          className="form-check-input me-2"
                          checked={labelSettings.paper_size === value}
                          onChange={() =>
                            setLabelSettings((p) => ({
                              ...p,
                              paper_size: value,
                            }))
                          }
                        />
                        <img src={img} width={36} className="me-2" />
                        <span>{title}</span>
                      </label>
                    ))}
                  </div>
              </div>
            </div>


            {/* HIDE OPTIONS */}
            <div className="mb-4">
  <label className="fw-semibold mb-2 d-block">Hide Options</label>

  {[
    [
      "hide_product_details",
      "Hide Product Details",
      "Product name and SKU will not be printed",
    ],
    [
      "hide_seller_gst_number",
      "Hide Seller GST Number",
      "GST number will be hidden from label",
    ],
    [
      "hide_warehouse_address",
      "Hide Warehouse Address",
      "Pickup address will not be shown",
    ],
    [
      "hide_warehouse_mobile_number",
      "Hide Warehouse Mobile Number",
      "Warehouse contact number will be hidden",
    ],
    [
      "hide_end_customer_contact_number",
      "Hide End Customer Contact Number",
      "Customer phone number will not appear",
    ],
  ].map(([key, title, desc]) => {
    const checked = !!labelSettings[key];

    return (
      <div
        key={key}
        role="button"
        onClick={() =>
          setLabelSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
          }))
        }
        className={`border rounded p-3 mb-2 d-flex align-items-start gap-3 cursor-pointer
          ${checked ? "border-dark bg-light" : "border-secondary-subtle"}`}
      >
        {/* CHECKBOX */}
        <input
          type="checkbox"
          className="form-check-input mt-1"
          checked={checked}
          onClick={(e) => e.stopPropagation()} // 🚨 VERY IMPORTANT
          onChange={(e) =>
            setLabelSettings((prev) => ({
              ...prev,
              [key]: e.target.checked,
            }))
          }
        />

        {/* TEXT */}
        <div>
          <div className="fw-semibold">{title}</div>
          <small className="text-muted">{desc}</small>
        </div>
      </div>
    );
  })}
</div>



            <button
              onClick={handleSubmit}
              className="btn btn-dark w-100 py-2"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-md-6 d-flex justify-content-center">
        <LabelPreview settings={labelSettings} logo={logo} />
      </div>
    </div>
  );
}

export default LabelSettings;
