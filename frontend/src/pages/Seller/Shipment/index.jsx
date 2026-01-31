import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import OrdersFilter from "../Orders/OrdersFilter";
import Icon from "@mdi/react";
import { mdiClose, mdiFilterOutline } from "@mdi/js";
import ShipmentFiltersOffcanvas from "./ShipmentFiltersOffcanvas";

function Shipments() {
    const [showFilters, setShowFilters] = useState(false);
    const location = useLocation();

    const isShipmentView = location.pathname.startsWith("/shipments/view");
    useEffect(() => {
        if (isShipmentView) {
            setShowFilters(false);
        }
    }, [isShipmentView]);

    return (
        <div className="row">
            <div className="col-md-12 grid-margin stretch-card d-md-flex">
                <div className="card">
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-4">
                                <h4 className="card-title">Forward</h4>
                            </div>

                            <div className="col-md-8 col-sm-12 d-flex justify-content-end gap-2">
                                {!isShipmentView && (
                                    <button
                                        onClick={() => setShowFilters(prev => !prev)}
                                        type="button"
                                        className="btn btn-dark btn-md py-2 px-4"
                                    >
                                        {showFilters ? (
                                            <>
                                                <Icon path={mdiClose} size={0.7} /> Close
                                            </>
                                        ) : (
                                            <>
                                                <Icon path={mdiFilterOutline} size={0.7} /> Filter
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* {!isShipmentView && showFilters && (
                                <OrdersFilter setShowFilters={setShowFilters} />
                            )} */}
                            {showFilters && <ShipmentFiltersOffcanvas
                                isOpen={showFilters}
                                onClose={() => setShowFilters(false)}
                                onApply={(filters) => {
                                    console.log(filters);
                                    // API / URL params logic here
                                }}
                            />}
                        </div>
                        <div className="shipment-tabs d-flex flex-wrap gap-4">
                            <div className="tab-section">
                                <div className="tab_header">Shipment Summary</div>
                                <div className="btn-group flex-wrap w-100">
                                    <button className="btn custom_tab">All <br />0</button>
                                    <button className="btn custom_active_tab">Cancelled <br />0</button>
                                </div>
                            </div>

                            <div className="tab-section">
                                <div className="tab_header">Shipment Journey</div>
                                <div className="btn-group flex-wrap w-100">
                                    <button className="btn custom_tab">Ready For Pickup <br />0</button>
                                    <button className="btn custom_tab">In Transit <br />0</button>
                                    <button className="btn custom_tab">Delivered <br />0</button>
                                    <button className="btn custom_tab">RTO <br />0</button>
                                </div>
                            </div>

                            <div className="tab-section">
                                <div className="tab_header">NDR Exceptions</div>
                                <div className="btn-group flex-wrap w-100">
                                    <button className="btn custom_tab">Action Required <br />0</button>
                                    <button className="btn custom_tab">Action Requested <br />0</button>
                                </div>
                            </div>
                        </div>


                        <div className="row mt-3">
                            <div className="col-12">
                                <Outlet />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Shipments;
