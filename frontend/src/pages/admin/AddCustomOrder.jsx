import { useNavigate } from 'react-router-dom'
import CustomOrderForm from '../../components/admin/CustomOrderForm'
import { addCustomOrder } from '../../services/adminService'

// "Add Custom Order" (was add-custom.php). Saves the order, emails the customer the payment link,
// then goes back to the Inventory with a message.
export default function AddCustomOrder() {
  const navigate = useNavigate()

  const handleSubmit = async (fields, image) => {
    const res = await addCustomOrder(fields, image)
    if (res.success) {
      const toast = res.emailSent
        ? { id: Date.now(), color: 'green', duration: 5000, check: true, text: `Custom order sent successfully to ${res.email}!` }
        : { id: Date.now(), color: 'red', duration: 8000, text: `Custom order saved, but the email to ${res.email} could not be sent. Is the mailer running?` }
      navigate('/admin/inventory', { state: { toast } })
    }
    return res
  }

  return (
    <CustomOrderForm
      mode="add"
      title="Add Custom Order"
      subtitle="Create a made-to-order piece and email the customer"
      submitLabel="Add Custom Order"
      initial={{}}
      onSubmit={handleSubmit}
    />
  )
}
