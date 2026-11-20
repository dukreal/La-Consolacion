import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PremadeProductForm from '../../components/admin/PremadeProductForm'
import { getProduct, updateProduct } from '../../services/adminService'

// "Edit Premade Product" (was edit-product.php, at /admin/inventory/edit-premade/:id).
// SuperAdmins can change everything; Admins only the stock.
export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getProduct(id)
      .then((d) => {
        if (d.success) setData(d)
        else if (d.error === 'Product not found') navigate('/admin/inventory', { replace: true }) // same as the old page
        else setError(d.message || d.error)
      })
      .catch(() => setError('Network error. Please try again.'))
  }, [id, navigate])

  const handleSubmit = async (fields, image) => {
    const res = await updateProduct(id, fields, image)
    if (res.success) navigate('/admin/inventory')
    return res
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return null

  return (
    <PremadeProductForm
      key={data.product.id}
      title="Edit Premade Product"
      subtitle={data.product.name}
      submitLabel="Save Changes"
      variant="edit"
      initial={data.product}
      imageUrl={data.product.image ? `/uploads/products/${data.product.image}` : ''}
      stockOnly={data.adminLevel < 2}
      onSubmit={handleSubmit}
    />
  )
}
