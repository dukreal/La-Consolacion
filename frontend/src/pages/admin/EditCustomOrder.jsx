import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CustomOrderForm from '../../components/admin/CustomOrderForm'
import ProductFormSkeleton from '../../components/admin/ProductFormSkeleton'
import { getCustomOrderForEdit, updateCustomOrder } from '../../services/adminService'

// "Edit Custom Order" (was edit-custom.php). Any admin can change every field.
export default function EditCustomOrder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getCustomOrderForEdit(id)
      .then((d) => {
        if (d.success) setOrder(d.order)
        else if (d.error === 'Custom order not found') navigate('/admin/inventory', { replace: true }) // same as the old page
        else setError(d.message || d.error)
      })
      .catch(() => setError('Network error. Please try again.'))
  }, [id, navigate])

  const handleSubmit = async (fields, image) => {
    const res = await updateCustomOrder(id, fields, image)
    if (res.success) navigate('/admin/inventory')
    return res
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!order) {
    // Loading: the form's outline with grey placeholders
    return (
      <ProductFormSkeleton
        label="Loading custom order…"
        title="Edit Custom Order"
        submitLabel="Update Custom Order"
        details={[{ label: 'Customer Name' }, { label: 'Email' }, { label: 'Product Name', span: true }, { label: 'Description', span: true, tall: true }]}
        asideTitle="Price, stock and status"
        asideGrid="sm:grid-cols-3 xl:grid-cols-1"
        asideFields={['Price (₱)', 'Stock', 'Custom Order Status']}
      />
    )
  }

  return (
    <CustomOrderForm
      key={order.id}
      mode="edit"
      title="Edit Custom Order"
      subtitle={`${order.productName} for ${order.customerName}`}
      submitLabel="Update Custom Order"
      initial={order}
      imageUrl={order.image ? `/uploads/custom/${order.image}` : ''}
      onSubmit={handleSubmit}
    />
  )
}
