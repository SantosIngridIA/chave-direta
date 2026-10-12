export type SaleProperty = {
  id: string;
  title: string;
  place: string;
  price: number;
  rooms: number;
  area: number;
  image: string;
  tag: string;
};

export const saleProperties: readonly SaleProperty[] = [
  {
    id: "sale-1",
    title: "Apartamento com varanda",
    place: "Vila Mariana, São Paulo",
    price: 645000,
    rooms: 2,
    area: 68,
    image: "/property-1.png",
    tag: "Documentação organizada",
  },
  {
    id: "sale-2",
    title: "Casa com quintal",
    place: "Tatuapé, São Paulo",
    price: 790000,
    rooms: 3,
    area: 112,
    image: "/property-2.png",
    tag: "Aceita consórcio",
  },
  {
    id: "sale-3",
    title: "Studio próximo ao metrô",
    place: "Pinheiros, São Paulo",
    price: 480000,
    rooms: 1,
    area: 39,
    image: "/property-3.png",
    tag: "Financiável",
  },
];
