import { addressLines } from '../../utils/address'
import AddressFields from '../delivery/AddressFields'

// "How do you want to get your order?" on the Checkout and Custom Order Payment pages:
// Store pickup (the default) or Delivery by courier with the address.
// A customer with a saved address sees it as a card with Edit; otherwise the form, filled in with their name and mobile.
//
// The page keeps the choice in useDelivery() (hooks/useDelivery.js, so it survives going to step 2 and back):
//   const delivery = useDelivery()
//   <DeliveryChoice delivery={delivery} />
//   delivery.check()   on Continue: false (and the errors shown) when the address is not complete
//   delivery.payload   what submitPayment() sends: { fulfillment, address, saveAddress }

const STORE = { name: 'Store pickup', text: '170 Capistrano St, Cagayan de Oro · Mon–Sat, 9 AM – 5 PM' }
const ID = 'delivery' // must match useDelivery's ID (the error focus looks for `delivery-<field>`)

const CHOICES = [
  { value: 'pickup', title: STORE.name, text: STORE.text },
  { value: 'delivery', title: 'Delivery by courier', text: 'LBC or another courier, anywhere in the Philippines' },
]

export default function DeliveryChoice({ delivery }) {
  const { fulfillment, setFulfillment, address, setAddress, saved, editing, setEditing, saveAddress, setSaveAddress, changed, errors } = delivery

  const cancelEdit = () => {
    setAddress(saved)
    setEditing(false)
  }

  return (
    <div className="pay-card p-6 sm:p-7">
      <h3 id="deliveryTitle" className="pay-title text-xl mb-5">
        How do you want to get your order?
      </h3>
      <div role="radiogroup" aria-labelledby="deliveryTitle" className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-1 gap-3">
        {CHOICES.map((choice) => {
          const selected = fulfillment === choice.value
          return (
            <button
              type="button"
              key={choice.value}
              id={`fulfillment-${choice.value}`}
              role="radio"
              aria-checked={selected}
              onClick={() => setFulfillment(choice.value)}
              className={`pay-wallet w-full flex items-start gap-3 px-4 py-3.5 rounded-xl cursor-pointer text-left ${selected ? 'selected' : ''}`}
            >
              <span className="pay-radio mt-0.5" aria-hidden="true"></span>
              <span className="min-w-0">
                <span className="block font-semibold text-[#22306a]">{choice.title}</span>
                <span className="block text-[13px] pay-muted leading-snug mt-0.5">{choice.text}</span>
              </span>
            </button>
          )
        })}
      </div>

      {fulfillment === 'delivery' && (
        <div className="mt-5 space-y-4">
          {saved && !editing ? (
            // The address saved on the profile
            <div className="pay-panel p-4">
              {/* The Edit button moves under the address when they do not fit side by side */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div id="savedAddress" className="flex-1 min-w-[13rem] text-sm leading-relaxed text-[#22306a] [overflow-wrap:anywhere]">
                  {addressLines(address).map((line, index) => (
                    <div key={index} className={index === 0 ? 'font-semibold' : ''}>
                      {line}
                    </div>
                  ))}
                  {address.notes && <div className="pay-muted">Landmark/notes: {address.notes}</div>}
                </div>
                <button type="button" onClick={() => setEditing(true)} className="pay-btn-outline flex-shrink-0 text-sm">
                  Edit
                </button>
              </div>
              <p className="text-xs pay-muted mt-2">Your saved address. Edit it to send this order somewhere else.</p>
            </div>
          ) : (
            <>
              <AddressFields
                value={address}
                onChange={setAddress}
                errors={errors}
                idPrefix={ID}
                labelClass="pay-label"
                inputClass="pay-input"
              />
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                {changed ? (
                  <label className="inline-flex items-center gap-2.5 min-h-11 text-sm text-[#22306a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="w-[18px] h-[18px] accent-[#22306a]"
                    />
                    {saved ? 'Save as my address for next time' : 'Save this address for next time'}
                  </label>
                ) : (
                  <span />
                )}
                {saved && (
                  <button type="button" onClick={cancelEdit} className="min-h-11 text-sm font-semibold text-[#2474b6] [@media(hover:hover)]:hover:text-[#22306a]">
                    Use my saved address
                  </button>
                )}
              </div>
            </>
          )}
          <p className="pay-note text-[13px] leading-relaxed px-3.5 py-3 rounded-lg">
            We ship via LBC or another courier. When your order is ready, we tell you the shipping fee; you pay the balance and the shipping fee before we
            ship.
          </p>
        </div>
      )}
    </div>
  )
}
