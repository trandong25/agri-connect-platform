export type UserRole = "CONSUMER" | "FARMER" | "KOC"

export type AuthUser = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    phone_number: string | null
    avatar: string | null
    role: UserRole
    is_phone_verified: boolean
    date_joined: string
}

export type LoginRequest = {
    login: string
    password: string
}

export type LoginResponse = {
    access: string
    refresh: string
    user: AuthUser
}