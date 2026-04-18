export interface Experience {
  id: number;
  company: string;
  role: string;
  start: string;
  end: string;
  desc: string;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  field: string;
  years: string;
}

export interface Profile {
  phone: string;
  location: string;
  title: string;
  summary: string;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
  languages: string[];
}
