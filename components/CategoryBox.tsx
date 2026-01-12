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
          ? "border-b-neutral-800 text-neutral-800"
          : "border-transparent text-neutral-500"
      }`}
    >
      <Icon size={26} />
      <div className="font-medium text-sm">{label}</div>
    </div>
  );
};
export default CategoryBox;
