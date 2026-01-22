import React, { useState } from "react";
import { Offcanvas, Button } from "react-bootstrap";

const LEFT_TABS = [
    { key: "shipment", label: "Shipment Details" },
    { key: "courier", label: "Courier" },
    { key: "product", label: "Product Details" },
    { key: "source", label: "Source" },
];

function ShipmentFiltersOffcanvas({ isOpen, onClose, onApply }) {
    const [activeTab, setActiveTab] = useState("shipment");
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({});

    const PanelHeader = ({ title, searchable }) => (
        <div className="mb-3">
            <div className="d-flex justify-content-between mb-2">
                <strong>{title}</strong>
                <span className="text-muted small">Reset</span>
            </div>
            {searchable && (
                <input
                    className="form-control form-control-sm"
                    placeholder="Search"
                    onChange={(e) => setSearch(e.target.value)}
                />
            )}
        </div>
    );

    const EmptyState = () => (
        <div className="text-muted small">No items found</div>
    );

    const toggle = (group, value) => {
        setFilters((prev) => {
            const list = prev[group] || [];
            return {
                ...prev,
                [group]: list.includes(value)
                    ? list.filter((v) => v !== value)
                    : [...list, value],
            };
        });
    };

    const renderRightPanel = () => {
        switch (activeTab) {
            case "shipment":
                return (
                    <>
                        <PanelHeader title="Filter by Payment Type" />
                        {["Prepaid", "COD", "Pickup"].map((i) => checkbox("payment", i))}
                        <PanelHeader title="Filter by Zone" />
                        {["A", "B", "C", "D", "E"].map((i) => checkbox("zone", i))}
                        <PanelHeader title="Filter by Location" searchable />
                        {["Noida", "PHALODI MAHI", "SF-29 Ansal Fortune", "Noida pawan"]
                            .filter((i) => i.toLowerCase().includes(search.toLowerCase()))
                            .map((i) => checkbox("location", i))}
                    </>
                );

            case "courier":
                return (
                    <>
                        <PanelHeader title="Filter By Courier" searchable />
                        {checkbox("courier", "Bluedart")}
                    </>
                );

            case "product":
                return (
                    <>
                        <PanelHeader title="Product Description" searchable />
                        <EmptyState />
                    </>
                );

            case "source":
                return (
                    <>
                        <PanelHeader title="Filter By Channel" searchable />
                        {checkbox("channel", "Offline")}

                        <PanelHeader title="Filter By Campaign ID" searchable />
                        <EmptyState />

                        <PanelHeader title="Filter By Campaign Source" searchable />
                        <EmptyState />
                    </>
                );

            default:
                return null;
        }
    };

    const checkbox = (group, value) => (
        <div className="form-check mb-2" key={value}>
            <input
                className="form-check-input ms-0"
                type="checkbox"
                checked={(filters[group] || []).includes(value)}
                onChange={() => toggle(group, value)}
            />
            <label className="form-check-label">{value}</label>
        </div>
    );

    return (
        <Offcanvas
            show={isOpen}
            onHide={onClose}
            placement="end"
            className="filters-offcanvas"
            scroll={false}
            backdrop
        >

            {/* Header */}
            <Offcanvas.Header closeButton className="border-bottom">
                <Offcanvas.Title>Filters</Offcanvas.Title>
                <div className="ms-auto d-flex gap-2">
                    <Button size="sm" variant="light" disabled>Apply</Button>
                    <Button size="sm" variant="light" disabled>Reset All</Button>
                </div>
            </Offcanvas.Header>

            {/* Body */}
            <Offcanvas.Body className="p-0">
                <div className="d-flex h-100">
                    {/* LEFT */}
                    <div className="filters-left">
                        {LEFT_TABS.map((t) => (
                            <div
                                key={t.key}
                                className={`filters-tab ${activeTab === t.key ? "active" : ""}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                {t.label}
                            </div>
                        ))}
                    </div>

                    {/* RIGHT */}
                    <div className="filters-right">
                        {renderRightPanel()}
                    </div>
                </div>
            </Offcanvas.Body>

            {/* Footer */}
            {/* <div className="border-top p-3">
                <Button variant="secondary" className="w-100" disabled>
                    Apply
                </Button>
            </div> */}
        </Offcanvas>
    );
}

export default ShipmentFiltersOffcanvas;




