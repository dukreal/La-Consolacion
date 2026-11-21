import { labelClass } from '../../utils/adminForm'
import ProductFormLayout, { FormSection } from './ProductFormLayout'
import Skeleton, { LoadingArea } from './Skeleton'

// One field: its real label (so it wraps exactly like the form's), then a grey box where the input will be
// (span: across both columns; tall: the description box)
function FieldSkeleton({ label, span = false, tall = false }) {
  return (
    <div className={`${labelClass} ${span ? 'sm:col-span-2' : ''}`}>
      {label}
      <Skeleton className={`mt-1.5 w-full !rounded-[10px] ${tall ? 'h-[4.75rem]' : 'h-11'}`} />
    </div>
  )
}

const preventSubmit = (e) => e.preventDefault()

// What an edit page shows while the product is loading: the real title and buttons (Save greyed out until the
// form is ready), and grey placeholders laid out exactly like the form, so nothing moves when it arrives.
//   details: the fields of the "Details" section, e.g. [{ label: 'Product Name' }, ..., { label: 'Description', span: true, tall: true }]
//   asideTitle / asideGrid / asideFields: the price and stock section (asideFields: the labels)
//   notice: true to keep room for the "Admin-1 Mode" message
export default function ProductFormSkeleton({ title, submitLabel, label, details, asideTitle, asideGrid, asideFields, notice = false }) {
  return (
    <LoadingArea label={label}>
      <ProductFormLayout
        title={title}
        subtitle={<Skeleton className="inline-block align-middle h-4 sm:h-5 w-48 sm:w-64 max-w-full" />}
        notice={notice && <Skeleton className="mb-5 h-[3.125rem] !rounded-[10px]" />}
        saving
        submitLabel={submitLabel}
        onSubmit={preventSubmit}
        photo={
          <div>
            <Skeleton className="w-full aspect-square !rounded-xl" />
            {/* Replace / Remove (Admins who can only change the stock do not get them) */}
            {!notice && (
              <div className="mt-2 flex gap-2">
                <Skeleton className="flex-1 h-9 !rounded-lg" />
                <Skeleton className="flex-1 h-9 !rounded-lg" />
              </div>
            )}
            {/* Same hint as under the real picture (see ProductImageField) */}
            <p className="mt-2 text-xs text-gray-500 text-center sm:text-left">For best results, upload a 1x1 (square) image.</p>
          </div>
        }
        aside={
          <FormSection title={asideTitle} grid={asideGrid}>
            {asideFields.map((label) => <FieldSkeleton key={label} label={label} />)}
          </FormSection>
        }
      >
        <FormSection title="Details">
          {details.map((field) => <FieldSkeleton key={field.label} {...field} />)}
        </FormSection>
      </ProductFormLayout>
    </LoadingArea>
  )
}
