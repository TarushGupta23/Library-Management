import './table.css'

export default function Table({ titles, data }) {
    return <table>
        <thead>
            <tr>{
                titles.map((item, index) => (<th key={item+index}>{item}</th>))
            }</tr>
        </thead>
        <tbody>
            {
                data.map((arr, index) => (
                    <tr key={index}>{
                        arr.map((item, index) => (<td key={item+index}>{item}</td>))
                    }</tr>
                ))
            }
        </tbody>
    </table>
}