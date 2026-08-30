/**
 * Icons are deep-imported one file at a time. Importing them from the package
 * root pulls lucide's whole set into the bundle (~2 MB) because Metro does not
 * tree-shake the barrel; this keeps only what the app actually draws.
 */
export { default as ArrowRight } from 'lucide-react-native/icons/arrow-right';
export { default as Bath } from 'lucide-react-native/icons/bath';
export { default as BedDouble } from 'lucide-react-native/icons/bed-double';
export { default as ChartColumn } from 'lucide-react-native/icons/chart-column';
export { default as Check } from 'lucide-react-native/icons/check';
export { default as ChefHat } from 'lucide-react-native/icons/chef-hat';
export { default as ChevronDown } from 'lucide-react-native/icons/chevron-down';
export { default as ChevronRight } from 'lucide-react-native/icons/chevron-right';
export { default as Compass } from 'lucide-react-native/icons/compass';
export { default as DoorOpen } from 'lucide-react-native/icons/door-open';
export { default as Download } from 'lucide-react-native/icons/download';
export { default as FileText } from 'lucide-react-native/icons/file-text';
export { default as ImageIcon } from 'lucide-react-native/icons/image';
export { default as Plus } from 'lucide-react-native/icons/plus';
export { default as RefreshCw } from 'lucide-react-native/icons/refresh-cw';
export { default as ShieldCheck } from 'lucide-react-native/icons/shield-check';
export { default as Sofa } from 'lucide-react-native/icons/sofa';
export { default as Trash2 } from 'lucide-react-native/icons/trash-2';
export { default as Upload } from 'lucide-react-native/icons/upload';
export { default as Zap } from 'lucide-react-native/icons/zap';
