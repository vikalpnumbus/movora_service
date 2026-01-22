import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom';
import SellerDashboardConfig from '../../../config/SellerDashboard/SellerDashboardConfig';
import api from '../../../utils/api';

function ProductWiseStats({ defaultStart, defaultEnd }) {
    const [loading, setLoading] = useState(false);
    const [statsData, setStatsData] = useState([]);
    const [searchParams] = useSearchParams();

    const handleFetchData = async () => {
        setLoading(true);
        try {
            const params = {
                start_date: searchParams.get("start_date") || defaultStart,
                end_date: searchParams.get("end_date") || defaultEnd,
            };

            const query = new URLSearchParams(params).toString();
            const url = `${SellerDashboardConfig.productWiseStats}?${query}`;

            const { data } = await api.get(url);
            setStatsData(data?.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
            setStatsData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleFetchData();
    }, [searchParams]);
    return (
        <div className="row">
            <div className="col-lg-12 d-flex flex-column">
                <div className="row flex-grow">
                    <div className="col-12 grid-margin stretch-card">
                        <div className="card card-rounded">
                            <div className="card-body">
                                <h4 className="card-title card-title-dash">
                                    Courier Wise Status
                                </h4>

                                {loading ? (
                                    <div className="dot-opacity-loader">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                ) : (
                                    <div className="table-responsive h-100">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Product Name</th>
                                                    <th>Product SKU</th>
                                                    <th>Total Shipments</th>
                                                    <th>Not Shipped</th>
                                                    <th>Pending Pickup</th>
                                                    <th>In Transit</th>
                                                    <th>Delivered</th>
                                                    <th>RTO</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {statsData.length > 0 ? (
                                                    statsData.map((data) => {
                                                        return (
                                                            <tr>
                                                                <td className="py-3">
                                                                    {data.product_name || ""}
                                                                </td>
                                                                <td className="py-3">
                                                                    {data.product_sku || ""}
                                                                </td>
                                                                <td className="py-3">
                                                                    {data.total_shipments || ""}
                                                                </td>
                                                                <td className="py-3">
                                                                    which field
                                                                </td>
                                                                <td className="py-3">
                                                                    {data.pending_pickup_count || ""}
                                                                </td>
                                                                <td className="py-3">
                                                                    {data.in_transit_count || ""}
                                                                </td>
                                                                <td className="py-3">
                                                                    {data.delivered_count || ""}
                                                                </td>
                                                                <td className="py-3">
                                                                    {data.rto_count || ""}
                                                                </td>

                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center">
                                                            No records found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default ProductWiseStats
