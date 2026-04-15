export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;

    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    phone: string | null;
    profilePhotoUrl: string | null;
    bio: string | null;

    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
    lastActiveAt: Date | null;
    userStatus: "PENDING" | "ACTIVE" | "SUSPENDED" | "BANNED" | "DELETED";
    deletedAt: Date | null;
}

export interface OnboardingUserBody {
    firstName: string;
    lastName: string;
    phone?: string;
    bio?: string;
}

export interface UpdateUserBody {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    bio?: string;
    profilePhotoUrl?: string;
}
