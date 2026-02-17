import React, { useCallback, useState, useEffect, useRef } from "react";
import api from "../../../utils/api";
import warehouseConfig from "../../../config/Warehouse/WarehouseConfig";
import ProductSection from "./ProductSection";
import { useAlert } from "../../../middleware/AlertContext";
import ordersConfig from "../../../config/Orders/OrdersConfig";
import { useNavigate, useParams } from "react-router-dom";
import WarehouseDropdown from "./WarehouseDropdown";
import { stringifyPayload } from "../../../middleware/CommonFunctions";
import AddWarehouseModal from "../../../Component/AddWarehouseModal";

const defaultForm = {
  orderId: "",
  paymentType: "",
  "shippingDetails.fname": "",
  "shippingDetails.lname": "",
  "shippingDetails.address": "",
  "shippingDetails.pincode": "",
  "shippingDetails.city": "",
  "shippingDetails.state": "",
  "shippingDetails.phone": "",
  "shippingDetails.alternatePhone": "",
  "packageDetails.weight": "",
  "packageDetails.height": "",
  "packageDetails.breadth": "",
  "packageDetails.length": "",
  "packageDetails.volumetricWeight": "",
  orderAmount: "",
  "charges.shipping": "",
  "charges.tax_amount": "",
  "charges.cod": "",
  "charges.discount": "",
  collectableAmount: "",
  products: [],
  warehouse_id: "",
  rto_warehouse_id: "",
};

function OrdersForm() {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productsPrice, setProductsPrice] = useState(0);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [initialWarehouseData, setInitialWarehouseData] = useState("");
  const [initialRtoWarehouseData, setInitialRtoWarehouseData] = useState([]);
  const { showError, showSuccess } = useAlert();
  const { id } = useParams();
  const navigate = useNavigate();
  const inputRefs = useRef({});

  const setRef = (name, node) => {
    if (node) inputRefs.current[name] = node;
  };

  /* -------------------- ORDER ID -------------------- */
  useEffect(() => {
    const uniqueId = `${Math.floor(Date.now() / 1000)}`;
    setForm(prev => ({
      ...prev,
      orderId: `${uniqueId}${location.pathname.includes("/clone") ? "-Copy" : ""}`,
    }));
  }, []);

  /* -------------------- HANDLE CHANGE -------------------- */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (
      name === "shippingDetails.phone" ||
      name === "shippingDetails.alternatePhone"
    ) {
      if (!/^\d*$/.test(value)) return;

      if (value === "" || /^[6-9]\d{0,9}$/.test(value)) {
        newValue = value.slice(0, 10);
      } else {
        return;
      }
    }

    if (name === "paymentType") {
      setForm((prev) => ({ ...prev, "charges.cod": "", collectableAmount: "" }));
      setErrors((prev) => ({ ...prev, "charges.cod": "", collectableAmount: "" }));
    }

    if (
      name === "packageDetails.weight" ||
      name === "packageDetails.height" ||
      name === "packageDetails.breadth" ||
      name === "packageDetails.length" ||
      name === "charges.cod" ||
      name === "charges.discount" ||
      name === "charges.tax_amount" ||
      name === "charges.shipping" ||
      name === "orderAmount"
    ) {
      if (!/^\d*\.?\d{0,2}$/.test(value)) return;
    }

    if (
      name === "packageDetails.height" ||
      name === "packageDetails.breadth" ||
      name === "packageDetails.length"
    ) {
      if (value > 9999) return;
    }

    if (name === "shippingDetails.pincode") {
      if (!/^\d*$/.test(value)) return;
    }

    if (name === "collectableAmount") {
      const collectable = Number(newValue);
      const orderAmount = Number(form?.orderAmount);
      if (collectable > orderAmount) {
        setErrors(prev => ({
          ...prev,
          [name]: "Collectable amount cannot be greater than order amount",
        }));
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, [form.orderAmount]);

  /* -------------------- PINCODE -------------------- */
  useEffect(() => {
    const fetchPincode = async () => {
      if (!/^\d{6}$/.test(form["shippingDetails.pincode"])) return;
      setLoadingPincode(true);
      try {
        const res = await api.get(
          `${warehouseConfig.pincodeApi}/${form["shippingDetails.pincode"]}`
        );
        if (!res?.data?.data) {
          setErrors(prev => ({
            ...prev,
            "shippingDetails.pincode": "Invalid pincode",
          }));
          return;
        }
        setForm(prev => ({
          ...prev,
          "shippingDetails.city": res.data.data.city,
          "shippingDetails.state": res.data.data.state,
        }));
      } catch {
        setErrors(prev => ({
          ...prev,
          "shippingDetails.pincode": "Invalid pincode",
        }));
      } finally {
        setLoadingPincode(false);
      }
    };

    fetchPincode();
  }, [form["shippingDetails.pincode"]]);

  /* -------------------- VOLUMETRIC WEIGHT -------------------- */
  useEffect(() => {
    const l = Number(form["packageDetails.length"]) || 0;
    const b = Number(form["packageDetails.breadth"]) || 0;
    const h = Number(form["packageDetails.height"]) || 0;

    const vol = l && b && h ? ((l * b * h) / 5000).toFixed(2) : "0";
    setForm(prev => ({ ...prev, "packageDetails.volumetricWeight": vol }));
  }, [
    form["packageDetails.length"],
    form["packageDetails.breadth"],
    form["packageDetails.height"],
  ]);

  /* -------------------- FINAL AMOUNT -------------------- */
  useEffect(() => {
  if (form.paymentType === "prepaid") {
    setForm(prev => ({
      ...prev,
      collectableAmount: "0",
    }));
    return;
  }

  const finalAmount = parseFloat(productsPrice) || 0;
  const shipping = parseFloat(form["charges.shipping"]) || 0;
  const tax = parseFloat(form["charges.tax_amount"]) || 0;
  const cod =
    form.paymentType === "cod"
      ? parseFloat(form["charges.cod"]) || 0
      : 0;
  const discount = parseFloat(form["charges.discount"]) || 0;

  const total = finalAmount + shipping + tax + cod - discount;

  setForm(prev => ({
    ...prev,
    orderAmount: total.toFixed(2),
    collectableAmount: total.toFixed(2),
  }));
}, [
  productsPrice,
  form["charges.shipping"],
  form["charges.tax_amount"],
  form["charges.cod"],
  form["charges.discount"],
  form.paymentType,
]);

const handleBlur = (e) => {
  const { name, value } = e.target;
  validateField(name, value);
};

const validateForm = (form) => {
    const errors = {};
    if (!form.paymentType) errors.paymentType = "Payment type required";
    if (!form["shippingDetails.fname"])
      errors["shippingDetails.fname"] = "First name required";
    if (!form["shippingDetails.lname"])
      errors["shippingDetails.lname"] = "Last name required";
    if (!form["shippingDetails.address"])
      errors["shippingDetails.address"] = "Address required";
    if (!form["shippingDetails.pincode"])
      errors["shippingDetails.pincode"] = "Pincode required";
    else if (!/^\d{6}$/.test(form["shippingDetails.pincode"]))
      errors["shippingDetails.pincode"] = "Enter valid 6-digit pincode";
    if (!form["shippingDetails.city"])
      errors["shippingDetails.city"] = "City required";
    if (!form["shippingDetails.state"])
      errors["shippingDetails.state"] = "State required";
    if (!form["shippingDetails.phone"])
      errors["shippingDetails.phone"] = "Phone number required";
    else if (!/^\d{10}$/.test(form["shippingDetails.phone"]))
      errors["shippingDetails.phone"] = "Enter valid 10-digit phone number";

    if (
      form["shippingDetails.alternatePhone"] &&
      !/^\d{10}$/.test(form["shippingDetails.alternatePhone"])
    ) {
      errors["shippingDetails.alternatePhone"] =
        "Enter valid 10-digit phone number";
    }

    if (!form["packageDetails.weight"])
      errors["packageDetails.weight"] = "Weight required";
    const dimensionFields = [
      { key: "packageDetails.length", label: "Length" },
      { key: "packageDetails.breadth", label: "Breadth" },
      { key: "packageDetails.height", label: "Height" },
    ];

    dimensionFields.forEach(({ key, label }) => {
      const value = form[key];

      if (!value) {
        errors[key] = `${label} required`;
      } else if (!/^\d*\.?\d{0,2}$/.test(value)) {
        errors[key] = `Enter valid ${label.toLowerCase()}`;
      } else if (parseFloat(value) <= 0) {
        errors[key] = `Must be greater than 0`;
      }
    });
    if (!form["packageDetails.volumetricWeight"])
      errors["packageDetails.volumetricWeight"] = "Volumetric weight required";
    if (!form.orderAmount) errors.orderAmount = "Final amount required";
    if (!form["charges.tax_amount"])
      errors["charges.tax_amount"] = "Tax amount required";
    if (form.paymentType === "cod" && !form["charges.cod"])
      errors["charges.cod"] = "COD charge required";
    if (!form.products || form.products.length === 0)
      errors.products = "At least one product must be added";
    if (!form.warehouse_id) errors.warehouse_id = "Warehouse required";
    if (!form.rto_warehouse_id)
      errors.rto_warehouse_id = "RTO Warehouse required";
    return errors;
  };


  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      const firstErrorField = Object.keys(newErrors)[0];
      const node = inputRefs.current[firstErrorField];
      if (node && node.scrollIntoView) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        node.focus();
      }
      return;
    }
    setLoading(true);
    try {
      const isEdit = location.pathname.includes("/orders/edit");
      const url = isEdit
        ? `${ordersConfig.ordersApi}/${id}`
        : ordersConfig.ordersApi;
      const method = isEdit ? "patch" : "post";

      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === "object" && value !== null)
            return Object.values(value).some(
              (v) => v !== "" && v !== null && v !== undefined
            );
          return value !== "" && value !== null && value !== undefined;
        })
      );

      payload.order_source = "portal";
      // payload.rto_warehouse_id = "12";

      if (payload.paymentType === "prepaid") {
        if (!payload["charges.cod"]) payload["charges.cod"] = "0";
      }
      if (!payload["charges.discount"]) payload["charges.discount"] = "0";
      if (!payload["charges.shipping"]) payload["charges.shipping"] = "0";

      const payloadString = stringifyPayload(payload);

      const response = await api[method](url, payloadString);

      if (response.status === 201 || response?.data?.status === 201) {
        showSuccess(
          response.data?.data?.message || "Warehouse saved successfully!"
        );
        if (location.pathname.includes("/orders/clone")) {
          navigate("/orders");
        } else {
          navigate(-1);
        }
      }
    } catch (err) {
      if (Array.isArray(err?.response?.data?.message)) {
        const newErrors = err.response.data.message.reduce((acc, data) => {
          acc[data.field] = data.message;
          return acc;
        }, {});
        setErrors((prev) => ({ ...prev, ...newErrors }));
      } else {
        const errorMsg =
          typeof err?.response?.data?.message === "string"
            ? err.response.data.message
            : typeof err?.response?.data === "string"
              ? err.response.data
              : "Something went wrong";

        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container-fluid">
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* LEFT */}
            <div className="col-lg-8 shadow-sm">
              <Section title="Shipping Information">
                <div className="col-md-6">
                  <label className="form-label">
                    First Name<span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingDetails.fname"
                    className={`form-control ${
                      errors["shippingDetails.fname"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.fname"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />

                  {errors["shippingDetails.fname"] && (
                    <small className="text-danger">
                      {errors["shippingDetails.fname"]}
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Last Name<span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingDetails.lname"
                    className={`form-control ${
                      errors["shippingDetails.lname"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.lname"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />

                  {errors["shippingDetails.lname"] && (
                    <small className="text-danger">
                      {errors["shippingDetails.lname"]}
                    </small>
                  )}
                </div>
                <div className="col-md-12">
                  <label className="form-label">
                    Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    type="text"
                    name="shippingDetails.address"
                    className={`form-control address-textarea ${
                      errors["shippingDetails.address"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.address"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors["shippingDetails.address"] && (
                    <small className="text-danger">
                      {errors["shippingDetails.address"]}
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingDetails.phone"
                    className={`form-control ${
                      errors["shippingDetails.phone"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.phone"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />

                  {errors["shippingDetails.phone"] && (
                    <small className="text-danger">
                      {errors["shippingDetails.phone"]}
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Alternate Phone (Optional)
                  </label>
                  <input
                    type="text"
                    name="shippingDetails.alternatePhone"
                    className={`form-control ${
                      errors["shippingDetails.alternatePhone"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.alternatePhone"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors["shippingDetails.alternatePhone"] && (
                    <small className="text-danger">
                      {errors["shippingDetails.alternatePhone"]}
                    </small>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    Pincode <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingDetails.pincode"
                    className={`form-control ${
                      errors["shippingDetails.pincode"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.pincode"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    loading={loadingPincode}
                  />
                  {errors["shippingDetails.pincode"] && (
                    <small className="text-danger">
                      {errors["shippingDetails.pincode"]}
                    </small>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    City <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingDetails.city"
                    className={`form-control ${
                      errors["shippingDetails.city"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.city"] || ""}
                    disabled
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    State <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingDetails.state"
                    className={`form-control ${
                      errors["shippingDetails.state"] ? "is-invalid" : ""
                    }`}
                    value={form["shippingDetails.state"] || ""}
                    disabled
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              </Section>
              <hr></hr>
              <Section>
                <ProductSection
                  setForm={setForm}
                  setProductsPrice={setProductsPrice}
                  setErrors={setErrors}
                />
                {errors.products && (
                  <small className="text-danger d-block mt-1">
                    {errors.products}
                  </small>
                )}
              </Section>
              <hr></hr>
              <div className="row mt-4">
                <div className="col-md-6"></div>
                <div className="col-md-6">
                  <h4 className="text-start mb-3">Charges For Seller</h4>
                  <small className="charge-info-text">
                  All Charges Entered Here are Charged to the End Customer and Included in the Final Colletable Amount.
                  </small>
                  <hr></hr>
                  {/* Order Amount */}
                  <div className="row align-items-center mb-2">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Order Amount
                      </label>
                    </div>
                    <div className="col-md-8">
                      <input
                        className="form-control"
                        value={productsPrice}
                        disabled
                      />
                    </div>
                  </div>
                  {/* Shipping */}
                  <div className="row align-items-center mb-2">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Shipping Charge
                      </label>
                    </div>
                    <div className="col-md-8">
                      <input
                        className="form-control"
                        name="charges.shipping"
                        value={form["charges.shipping"]}
                        onChange={handleChange}
                      />
                      {errors["charges.shipping"] && (
                        <small className="text-danger">
                          {errors["charges.shipping"]}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="row align-items-center mb-2">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Tax Amount
                      </label>
                    </div>
                    <div className="col-md-8">
                      <input
                        className="form-control"
                        name="charges.tax_amount"
                        value={form["charges.tax_amount"]}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  {/* Discount */}
                  <div className="row align-items-center mb-2">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Discount
                      </label>
                    </div>
                    <div className="col-md-8">
                      <input
                        className="form-control"
                        name="charges.discount"
                        value={form["charges.discount"]}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                    {/* Final Amount */}
                    <div className="row align-items-center mb-2">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">
                          Collectable Amount
                        </label>
                      </div>
                      <div className="col-md-8">
                        <input
                          className="form-control bg-light fw-bold"
                          value={form.orderAmount}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* RIGHT */}
            <div className="col-lg-4">
              <Section title="Order Infomation">
                <div className="col-md-12">
                  <label className="form-label">
                    Order ID <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" value={form.orderId} disabled/>
                </div>
                <div className="col-md-12">
                  <label className="form-label">
                    Payment Type<span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${
                      errors.paymentType ? "is-invalid" : ""
                    }`}
                    name="paymentType"
                    value={form.paymentType || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <option value="">Select Payment Type</option>
                    <option value="cod">COD</option>
                    <option value="prepaid">Prepaid</option>
                  </select>

                  {errors.paymentType && (
                    <small className="text-danger">
                      {errors.paymentType}
                    </small>
                  )}
                </div>
              </Section>

              <Section title="Package">
                <div className="col-md-12">
                  <label className="form-label">
                    Weight (gm) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="packageDetails.weight"
                    className={`form-control ${
                      errors["packageDetails.weight"] ? "is-invalid" : ""
                    }`}
                    value={form["packageDetails.weight"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />

                  {errors["packageDetails.weight"] && (
                    <small className="text-danger">
                      {errors["packageDetails.weight"]}
                    </small>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    Length <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="packageDetails.length"
                    className={`form-control ${
                      errors["packageDetails.length"] ? "is-invalid" : ""
                    }`}
                    value={form["packageDetails.length"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />

                  {errors["packageDetails.length"] && (
                    <small className="text-danger">
                      {errors["packageDetails.length"]}
                    </small>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    Breadth <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="packageDetails.breadth"
                    className={`form-control ${
                      errors["packageDetails.breadth"] ? "is-invalid" : ""
                    }`}
                    value={form["packageDetails.breadth"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />

                  {errors["packageDetails.breadth"] && (
                    <small className="text-danger">
                      {errors["packageDetails.breadth"]}
                    </small>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    Height <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="packageDetails.height"
                    className={`form-control ${
                      errors["packageDetails.height"] ? "is-invalid" : ""
                    }`}
                    value={form["packageDetails.height"] || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />

                  {errors["packageDetails.height"] && (
                    <small className="text-danger">
                      {errors["packageDetails.height"]}
                    </small>
                  )}
                </div>
                <div className="col-md-12">
                  <label className="form-label">
                    Volumetric Weight
                  </label>
                  <input
                    type="text"
                    name="packageDetails.volumetricWeight"
                    className={`form-control ${
                      errors["packageDetails.volumetricWeight"] ? "is-invalid" : ""
                    }`}
                    value={form["packageDetails.volumetricWeight"] || ""}
                    disabled
                  />                  
                </div>
              </Section>
              
                <div className="col-md-12 mt-3">
                  <div className="col-md-12 d-flex justify-content-between align-items-center mt-3 mb-1">
                  <label className="fw-semibold mb-0">
                    Warehouse Details<span className="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={() => setShowAddWarehouseModal(true)}
                  >
                    + Add
                  </button>
                </div>
                <WarehouseDropdown
                  setForm={setForm}
                  setErrors={setErrors}
                  initialWarehouseData={initialWarehouseData}
                  warehouseType="normal"
                />
                {errors.warehouse_id && (
                  <small className="text-danger">{errors.warehouse_id}</small>
                )}
              </div>

              {/* ---------- RTO WAREHOUSE ---------- */}
              <div className="col-md-12 mt-3">
                <WarehouseDropdown
                  setForm={setForm}
                  setErrors={setErrors}
                  initialWarehouseData={initialRtoWarehouseData}
                  warehouseType="rto"
                />
                {errors.rto_warehouse_id && (
                  <small className="text-danger">{errors.rto_warehouse_id}</small>
                )}
              </div>

              <button className="btn btn-primary w-100 mt-3" disabled={loading}>
                {loading ? "Submitting..." : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showAddWarehouseModal && (
        <AddWarehouseModal onClose={() => setShowAddWarehouseModal(false)} />
      )}
    </>
  );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

const Section = ({ title, children }) => (
  <div className="card">
    <div className="card-body">
      <h5 className="mb-3">{title}</h5>
      <div className="row g-3">{children}</div>
    </div>
  </div>
);

const Input = ({ label, loading, ...props }) => (
  <div className="col-md-6">
    <label className="form-label">{label}</label>
    <input className="form-control" {...props} />
    {loading && <small className="text-muted">Fetching...</small>}
  </div>
);

export default OrdersForm;
