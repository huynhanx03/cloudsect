import spiritStoneImage from '../assets/spirit-stone.png';

export function SpiritStoneIcon({ size = 20 }: { size?: number }) {
  return <img className="spirit-stone-icon" src={spiritStoneImage} width={size} height={size} alt="" aria-hidden="true" />;
}
