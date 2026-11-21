import { useNavigate } from 'react-router-dom'
import PremadeProductForm from '../../components/admin/PremadeProductForm'
import { addProduct } from '../../services/adminService'

// "Add Premade Product" (was add-product.php, at /admin/inventory/add-premade). Back to the Inventory after saving.
export default function AddProduct() {
  const navigate = useNavigate()

  const handleSubmit = async (fields, image) => {
    const res = await addProduct(fields, image)
    if (res.success) navigate('/admin/inventory')
    return res
  }

  return (
    <PremadeProductForm
      title="Add Premade Product"
      subtitle="Add a ready-made piece to the shop"
      submitLabel="Add Product"
      variant="add"
      initial={{}}
      onSubmit={handleSubmit}
    />
  )
}
