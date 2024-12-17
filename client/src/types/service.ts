export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
}
