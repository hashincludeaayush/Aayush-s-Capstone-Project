'use client';

import Container from "./Container";
import { TbDeviceLaptop, TbDeviceMobile } from "react-icons/tb";
import CategoryBox from "./CategoryBox";



export const categories = [
    {
        label: 'Laptops',
        icon: TbDeviceLaptop
    },
    {
        label: 'Mobiles',
        icon:TbDeviceMobile
    },
    {
        label: 'Tablets',
        icon: TbDeviceLaptop
    },
    {
        label: 'Smart Watches',
        icon: TbDeviceLaptop
    },
    {
        label: 'Cameras',
        icon: TbDeviceMobile
    },
    {
        label: 'Headphones',
        icon: TbDeviceLaptop
    },
    {
        label: 'Speakers',
        icon: TbDeviceMobile
    },
    {
        label: 'Gaming',
        icon: TbDeviceLaptop
    },
    {
        label: 'TV & Home Theater',
        icon: TbDeviceMobile
    },
    {
        label: 'Drones',
        icon: TbDeviceMobile
    },
    {
        label: 'Printers & Scanners',
        icon: TbDeviceLaptop
    },
    {
        label: 'Storage',
        icon: TbDeviceMobile
    },

]


const Categories = () => {
    return (
        <Container>
            <div className="categories">
                {categories.map((item) => (
                    <CategoryBox 
                    key={item.label} 
                    label={item.label} 
                    icon={item.icon}
                    />
                ))}
            </div>
        </Container>
    );
}

export default Categories;