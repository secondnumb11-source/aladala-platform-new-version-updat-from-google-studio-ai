import fs from 'fs';
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
code = code.replace(/<SortableWidgetWrapper className=/g, '<EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className=');
code = code.replace(/<\/SortableWidgetWrapper>/g, '</EnhancedSortableWidgetWrapper>');
fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('done');
