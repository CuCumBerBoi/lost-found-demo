import { Card } from "@/components/ui/card";

type CardImageProps = {
  src: string;
  alt: string;
};

export const CardImage = ({ src, alt }: CardImageProps) => {
  return (
    <Card className='overflow-hidden'>
      <img src={src} alt={alt} className='w-full h-48 object-cover' />
    </Card>
  );
};
