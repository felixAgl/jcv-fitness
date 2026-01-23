export interface TransformationImage {
  id: string;
  url: string;
  alt: string;
  type: "progress" | "promo" | "gym";
}

export const transformationImages: TransformationImage[] = [
  {
    id: "physique-1",
    url: "https://scontent.cdninstagram.com/v/t51.82787-15/590534004_18548070952004242_4983184551387057976_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ig_cache_key=Mzc5NDE1NDc5MjAxNjc4NDI1NQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjEzMjB4MTc2MC5zZHIuQzMifQ%3D%3D&_nc_ohc=IqH3oys27ZUQ7kNvwGwSn1_&_nc_oc=Adl_ML7sjWUArxXfzypm3Tya2oKpFF-QXAp30TMMQGjMXNQFKkXZG4XKRbuPA0B8E-k&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=25vtO4u6WE34dTy4_tWXdQ&oh=00_AfrbaFZLmsSSdBzcyqRMkXFMhvMPBY1tmzK6l6J79k2ltA&oe=6978C3FF",
    alt: "JCV Fitness - Resultados reales",
    type: "progress",
  },
  {
    id: "promo-40dias",
    url: "https://scontent.cdninstagram.com/v/t51.82787-15/587031246_18543047788004242_1564970252820434265_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=104&ig_cache_key=Mzc3MzA1MjA1ODcyODQ2NTY4Mw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkyMC5zZHIuQzMifQ%3D%3D&_nc_ohc=SB2Ls8e8IasQ7kNvwERllxe&_nc_oc=Adkg_DzlOQs_BOsBhFordteSZZ7Vp_50yxEEzaGTbk6BugWJpH5Muz96ZK39y29dPFg&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=59SSyZkHyEuGr9kII1xuhw&oh=00_AfqNUN8xhtYA5Z5LixSvC8OyHUI5JWUvBCWdQsHr1O8lGA&oe=6978A716",
    alt: "Entrena conmigo por 40 dias - Promocion JCV",
    type: "promo",
  },
  {
    id: "gym-selfie",
    url: "https://scontent.cdninstagram.com/v/t51.82787-15/553383362_18528913897004242_7276416597663278886_n.jpg?stp=dst-jpegr_e35_tt6&_nc_cat=104&ig_cache_key=MzcyNzMxMjQ3Nzg5MDYyNzAzOA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkyMC5oZHIuQzMifQ%3D%3D&_nc_ohc=jwN1y05lWd0Q7kNvwEKQZ6i&_nc_oc=AdnTpeMjrcbA1XF-r1l8zFl9doJYtWlHw9d0WmQMSMiMyn0jTQVqN-AmuSc-h3n_KJ8&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=pnirRqpuZjD6NKVmA4kKRQ&oh=00_AfrZQWtD2qCqfuu0Zflk9Xouv7BUnHrG1-dqqFMIOTMq-Q&oe=6978C7DD",
    alt: "JCV en el gym - Entrenamiento",
    type: "gym",
  },
  {
    id: "gym-pose-1",
    url: "https://scontent.cdninstagram.com/v/t51.82787-15/541928315_18525617779004242_7340074331215276401_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ig_cache_key=MzcxNTE0NTQ2NjI3MTg1MTQwOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkyMC5zZHIuQzMifQ%3D%3D&_nc_ohc=SeaXaKZ-F-wQ7kNvwHFWd2_&_nc_oc=AdnHrurg7c-SzTsUbaAA6_k6NoEnu7Ak7vayh3kWYKB4uBzM6wfEZn7mufLpOnnlxfY&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=XmJa6-jBE4mugmr3N3nq0w&oh=00_Afq81xuhBVjM24Su78KIx-gBPYjD5J1fX9eaLX9r_NpjJQ&oe=6978B505",
    alt: "JCV Fitness - Resultados de entrenamiento",
    type: "gym",
  },
];
