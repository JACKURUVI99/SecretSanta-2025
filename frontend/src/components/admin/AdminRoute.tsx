import { Navigate } from 'react-router-dom';
import { getAdminToken } from '../../lib/api';
import AdminDashboard from './AdminDashboard';

export default function AdminRoute() {
    const token = getAdminToken();

    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    return <AdminDashboard />;
}
