

export type Kalla = {
  id: string;
  name: string;
  classId: string;
  className: string;
  specializationId: string;
  specializationName: string;
  yeshivaId: string;
  yeshivaName: string;
  engagedAt: string;
  engagedHebrew: string;
  weddingAt: string | null;
  weddingHebrew: string | null;
  hallName: string | null;
  hallCity: string | null;
  hideWeddingDate: boolean;
  isMine: boolean;
  updatedAt: string;
};

export type KallotFilters = {
  q?: string;
  classId?: string;
  yeshivaId?: string;
  specializationId?: string;
  sort?: "name" | "engagedAt" | "weddingAt" | "className";
  order?: "asc" | "desc";
  pageSize?: number;
};

export type KallotListResponse= {
    total:number,
    page: number,
    pageSize:number,
    items: Kalla[]
}

export type KallaBody = {
  name: string;
  specializationId: string;
  yeshivaId: string;
  engagedAt: string;
  weddingAt?: string | null;
  hallName?: string | null;
  hallCity?: string | null;
};

export type KallaFormValues = {
  name: string;
  classId: string;
  specializationId: string;
  yeshivaId: string;
  engagedAt: string;
  weddingAt: string;
  hallName: string;
  hallCity: string;
};