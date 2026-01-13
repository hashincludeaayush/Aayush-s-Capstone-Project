import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { IconType } from "react-icons/lib";

interface CategoryBoxProps {
  label: string;
  icon: IconType;
  selected?: boolean;
}

const CategoryBox: React.FC<CategoryBoxProps> = ({
  icon: Icon,
  label,
  selected,
}) => {
  const router = useRouter();
  const handleClick = useCallback(() => {
    if (selected) {
      router.push("/");
      return;
    }

    router.push(`/category/${encodeURIComponent(label)}`);
  }, [label, router, selected]);
  return (
    <div
      onClick={handleClick}
      className={`category-box border-b-2 ${
        selected
          ? "border-white-100 text-white-100"
          : "border-transparent text-white-200/70 hover:text-white-100"
      }`}
    >
      <Icon size={26} />
      <div className="font-medium text-sm">{label}</div>
    </div>
  );
};
export default CategoryBox;
