export interface Product {
  id: string;
  name: string;
  tag: string;
  description: string;
  price: string;
  image: string;
  isFlagship?: boolean;
  link?: string;
}

export interface NavLink {
  label: string;
  href: string;
}
