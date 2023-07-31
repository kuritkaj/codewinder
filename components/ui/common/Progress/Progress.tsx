import styles from "./Progress.module.css";

type ProgressProps = {
    width?: number;
}

const Progress = ({width}: ProgressProps) => {
    return (
        <div className={styles.loading} aria-busy="true" aria-describedby="progress">
            <div id="progress" className={styles.progress} style={{width: width ? `${width}px` : "100%"}}>
                <div className={styles.indicator}></div>
            </div>
        </div>
    );
}

export default Progress;