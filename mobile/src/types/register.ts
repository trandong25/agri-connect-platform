export type RegisterRole =
    | "CONSUMER"
    | "FARMER"
    | "KOC"

export type RegisterUserRequest = {
    first_name: string
    last_name: string
    username: string
    email: string
    phone_number?: string
    password: string
    role: RegisterRole
}

export type RegisterUserResponse = {
    id: number
    first_name: string
    last_name: string
    phone_number: string | null
    avatar: string | null
    username: string
    email: string
    role: RegisterRole
    is_phone_verified: boolean
    date_joined: string
}