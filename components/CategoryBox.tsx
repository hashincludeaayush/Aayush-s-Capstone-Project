import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { IconType } from "react-icons/lib";
import qs from "query-string";

interface CategoryBoxProps {
    label: string;
    icon: IconType;
    selected?: boolean;
}

const CategoryBox: React.FC<CategoryBoxProps> = ({ icon: Icon, label, selected }) => {
    const router = useRouter();
    const params = useSearchParams();
    const handleClick = useCallback(() => {
        let currentquery = {};
        if(params){
            currentquery = qs.parse(params.toString());
        }
        const updatedQuery: any = {
            ...currentquery,
            category: label
        }

        if(params?.get('category') === label){
            delete updatedQuery.category;
        }

        const url = qs.stringifyUrl({
            url:'/',
            query: updatedQuery
        }, { skipEmptyString: true, skipNull: true }); 

        router.push(url);}, [ label, params, router ]);
    return (
        <div onClick={handleClick} className={`category-box ${selected ? 'border-b-neutral-800' : 'border-transparent'}${selected ? 'text-neutral-800' : 'text-neutral-500'}`}>
            <Icon size={26} />
            <div className="font-medium text-sm">{label}</div>
        </div>
    );
};
export default CategoryBox;
function userCallback() {
    throw new Error("Function not implemented.");
}

