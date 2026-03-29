export interface Product {
  id: string;
  name: string;
  tag: string;
  description: string;
  price: string;
  image: string;
  isFlagship?: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}
