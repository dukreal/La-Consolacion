import { Link, useParams } from 'react-router-dom'
import { useCustomOrder } from '../../hooks/useCustomOrder'
import { formatMoney } from '../../utils/formatMoney'
import '../../styles/custom-order.css'

// "Custom Product Preview" (was custom-preview.php). Public: customers open it from a link.
export default function CustomOrderPreview() {
  const { id } = useParams()
  const { order, error, loading } = useCustomOrder(id)

  return (
    <div className="custom-order-page">
      <div className="preview-box">
        <h2>Custom Product Preview</h2>

        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {order && (
          <>
            {order.image && (
              <img src={`/uploads/custom/${order.image}`} className="preview-img" alt="Custom Product Image" />
            )}
            <div className="preview-label">Product Name:</div>
            <div className="preview-value">{order.name}</div>
            <div className="preview-label">Customer Name:</div>
            <div className="preview-value">{order.customerName}</div>
            <div className="preview-label">Email:</div>
            <div className="preview-value">{order.email}</div>
            {order.phone && (
              <>
                <div className="preview-label">Phone:</div>
                <div className="preview-value" id="previewPhone">{order.phone}</div>
              </>
            )}
            <div className="preview-label">Custom Description:</div>
            <div className="preview-value">{order.description}</div>
            <div className="price-display">₱{formatMoney(order.price)}</div>
            <div className="preview-label">Status:</div>
            <div className="preview-value">
              <span className={`status-badge status-${order.status}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <Link to={`/custom-order/${order.id}/payment`} className="btn">
              Proceed to Purchase
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
