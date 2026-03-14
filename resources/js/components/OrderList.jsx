import React, { useState, useEffect } from 'react';
import api from '../services/api';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orders');
            setOrders(response.data.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Erreur lors du chargement des commandes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h2>Liste des Commandes</h2>
            <ul>
                {orders.map(order => (
                    <li key={order.id}>
                        Commande #{order.id} - {order.status}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default OrderList;
