
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  comparisonText?: string;
  comparisonColor?: 'text-green-500' | 'text-red-500' | '';
  isIncrease?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, comparisonText, comparisonColor, isIncrease }) => {
  const arrowIcon = typeof isIncrease === 'boolean' 
    ? (isIncrease ? 'arrow-up-outline' : 'arrow-down-outline') 
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
      <div className={`p-3 rounded-full ${color} self-start`}>
        <ion-icon name={icon} className="text-2xl text-white"></ion-icon>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        {comparisonText && (
            <p className={`text-xs mt-1 flex items-center ${comparisonColor}`}>
                {arrowIcon && <ion-icon name={arrowIcon} className="mr-1"></ion-icon>}
                {comparisonText}
            </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;