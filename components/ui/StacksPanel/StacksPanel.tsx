import Card from "@/components/ui/common/Card";

const StacksPanel = ({ stacks }) => {
    return (
        <div>
            {stacks && stacks.length > 0 &&
                stacks.map((stacks) => (
                    <Card key={stacks.id} title={stacks.name}>
                        <h2>stack content here</h2>
                    </Card>)
                )
            }
        </div>
    );
}

export default StacksPanel;