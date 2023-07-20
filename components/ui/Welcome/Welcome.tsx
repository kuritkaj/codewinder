import styles from "./Welcome.module.css";

const Welcome = () => {
    function getSalutation() {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            return `Good morning!`;
        } else if (currentHour < 18) {
            return `Good afternoon!`
        } else {
            return `Good evening!`
        }
    }

    return (
        <div>
            <h2 className={styles.assistance}>{"What would you like to do?"}</h2>
        </div>
    )
}

export default Welcome;