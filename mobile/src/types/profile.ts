export type ApprovalStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"

export type CurrentUser = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    phone_number: string | null
    avatar: string | null
    role: "FARMER" | "CONSUMER" | "KOC"
    is_phone_verified: boolean
    date_joined: string
}

export type UpdateCurrentUserRequest = {
    first_name?: string
    last_name?: string
    phone_number?: string | null
}

export type FarmerProfile = {
    id: number
    farm_name: string
    address: string
    description: string
    verification_document: string | null
    approval_status: ApprovalStatus
    approved_at: string | null
    created_date: string
    updated_date: string
}

export type KocProfile = {
    id: number
    koc_name: string
    social_platform: string
    social_url: string
    follower: number
    approval_status: ApprovalStatus
    approved_at: string | null
    created_date: string
    updated_date: string
}

export type VerificationFile = {
    uri: string
    name: string
    type: string
}

export type CreateFarmerProfileRequest = {
    farm_name: string
    address: string
    description: string
    verification_document?: VerificationFile | null
}

export type CreateKocProfileRequest = {
    koc_name: string
    social_platform: string
    social_url: string
    follower: number
}