// Shared look of the admin product forms (Add/Edit Premade, Add/Edit Custom Order)

// Text inputs and dropdowns: 44px tall, site border and focus colour; greyed out when locked
export const fieldClass =
  'mt-1.5 block w-full h-11 px-3 rounded-[10px] border border-[#d8dce8] bg-white text-base font-normal text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed'

// The description box: same look, two lines tall to start, can be stretched downwards
export const textareaClass = fieldClass.replace('h-11', 'h-auto min-h-[4.75rem] py-2.5 resize-y')

// The label above each field
export const labelClass = 'block text-sm font-semibold text-gray-700'
