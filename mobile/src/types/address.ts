export type Address = {
    id: number
    recipient_name: string
    phone_number: string
    province: string
    ward: string
    address_detail: string
    is_default: boolean
    created_date: string
    updated_date: string
}

export type AddressWriteRequest = {
    recipient_name: string
    phone_number: string
    province: string
    ward: string
    address_detail: string
}